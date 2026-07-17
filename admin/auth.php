<?php
/**
 * Tektwig Recruitment Portal — Hostinger PHP Auth Controller
 * Handles email/password authentication against Supabase and sends 2FA codes via Resend.
 */

// Allow cross-origin requests from local testing if necessary
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

const SUPABASE_API_URL = 'https://ptvsiegxiiczrrwjprud.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0dnNpZWd4aWljenJyd2pwcnVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODU4NTQsImV4cCI6MjA5OTg2MTg1NH0.KEWUM_oFMKZbLhW9Oa5WO-Qnt8lVInPSshAdArCZ7WI';

// Load configuration
$configFile = __DIR__ . '/config.php';
if (!file_exists($configFile)) {
    echo json_encode([
        "status" => "error",
        "message" => "Configuration file config.php is missing on the server. Please create it."
    ]);
    exit;
}

require_once $configFile;

if (!defined('RESEND_API_KEY') || !defined('ADMIN_EMAILS') || !is_array(ADMIN_EMAILS)) {
    echo json_encode([
        "status" => "error",
        "message" => "Configuration constants RESEND_API_KEY or ADMIN_EMAILS are undefined or invalid."
    ]);
    exit;
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'login') {
        $email = isset($input['email']) ? trim($input['email']) : '';
        $password = isset($input['password']) ? $input['password'] : '';

        if (empty($email) || empty($password)) {
            echo json_encode(["status" => "error", "message" => "Email and password are required."]);
            exit;
        }

        // Only allow the designated admin emails to log into the admin panel
        if (!in_array(strtolower($email), array_map('strtolower', ADMIN_EMAILS))) {
            echo json_encode(["status" => "error", "message" => "Unauthorized access."]);
            exit;
        }

        // Verify credentials with Supabase
        $ch = curl_init(SUPABASE_API_URL . '/auth/v1/token?grant_type=password');
        $payload = json_encode([
            "email" => $email,
            "password" => $password
        ]);

        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'apikey: ' . SUPABASE_ANON_KEY,
            'Content-Type: application/json'
        ]);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $resData = json_decode($response, true);

        if ($httpCode !== 200 || isset($resData['error'])) {
            $msg = isset($resData['error_description']) ? $resData['error_description'] : (isset($resData['error']) ? $resData['error'] : 'Invalid credentials.');
            echo json_encode(["status" => "error", "message" => $msg]);
            exit;
        }

        // Credentials valid. Generate 6-digit OTP code
        $otp = sprintf("%06d", mt_rand(0, 999999));
        $expires = time() + 600; // 10 minutes expiry

        // Store session and OTP in server session
        $_SESSION['pending_admin_auth'] = [
            "email" => $email,
            "otp" => $otp,
            "expires" => $expires,
            "session" => $resData
        ];

        // Send OTP via Resend API
        $resendCh = curl_init('https://api.resend.com/emails');
        
        // If sending domain is verified in Resend, use auth@tektwig.com, otherwise fall back to onboarding@resend.dev
        $fromEmail = (strpos(RESEND_API_KEY, 're_') === 0 && !empty(ADMIN_EMAILS)) ? 'Tektwig Security <auth@tektwig.com>' : 'onboarding@resend.dev';
        
        $emailPayload = json_encode([
            "from" => $fromEmail,
            "to" => $email,
            "subject" => "Tektwig Admin Verification Code: $otp",
            "html" => "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #0b0f19; color: #ffffff;'>
                    <h2 style='color: #a855f7; text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;'>Tektwig Secure Access</h2>
                    <p style='font-size: 1.1em;'>Hello Administrator,</p>
                    <p>A login request was initiated for your Tektwig Admin Portal. Please use the following 6-digit One-Time Password (OTP) to complete your 2-step verification:</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <span style='font-size: 2.2em; font-weight: bold; letter-spacing: 6px; padding: 12px 24px; border: 2px dashed #06b6d4; border-radius: 8px; background-color: rgba(6, 182, 212, 0.1); color: #06b6d4;'>$otp</span>
                    </div>
                    <p style='color: #94a3b8; font-size: 0.9em; text-align: center;'>This verification code is valid for <strong>10 minutes</strong>. If you did not request this code, please secure your account immediately.</p>
                </div>
            "
        ]);

        curl_setopt($resendCh, CURLOPT_POSTFIELDS, $emailPayload);
        curl_setopt($resendCh, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . RESEND_API_KEY,
            'Content-Type: application/json'
        ]);
        curl_setopt_array($resendCh, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_SSL_VERIFYPEER => true
        ]);

        $resendResponse = curl_exec($resendCh);
        $resendHttpCode = curl_getinfo($resendCh, CURLINFO_HTTP_CODE);
        curl_close($resendCh);

        $resendData = json_decode($resendResponse, true);

        if ($resendHttpCode >= 400) {
            $errorMsg = isset($resendData['message']) ? $resendData['message'] : 'Failed to send email via Resend.';
            echo json_encode(["status" => "error", "message" => "2FA dispatch failed: " . $errorMsg]);
            exit;
        }

        echo json_encode(["status" => "otp_required"]);
        exit;
    }

    if ($action === 'verify') {
        $code = isset($input['code']) ? trim($input['code']) : '';

        if (empty($code)) {
            echo json_encode(["status" => "error", "message" => "Verification code is required."]);
            exit;
        }

        if (!isset($_SESSION['pending_admin_auth'])) {
            echo json_encode(["status" => "error", "message" => "No login session pending. Please log in again."]);
            exit;
        }

        $pending = $_SESSION['pending_admin_auth'];

        if (time() > $pending['expires']) {
            unset($_SESSION['pending_admin_auth']);
            echo json_encode(["status" => "error", "message" => "Verification code has expired. Please log in again."]);
            exit;
        }

        if ($code !== $pending['otp']) {
            echo json_encode(["status" => "error", "message" => "Invalid verification code. Please try again."]);
            exit;
        }

        // Successfully verified! Release token to client and clear session
        $sessionData = $pending['session'];
        unset($_SESSION['pending_admin_auth']);

        echo json_encode([
            "status" => "success",
            "session" => $sessionData
        ]);
        exit;
    }
}

echo json_encode(["status" => "error", "message" => "Invalid endpoint action."]);
exit;
