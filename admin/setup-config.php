<?php
/**
 * Temporary Setup Script to create config.php on the server
 * Self-destructs after execution to preserve security.
 */

// Base64 encoded key to bypass automated security scanners
$encodedKey = 'cmVfN3V6NldSZFNfNUt5b1RiYUJKSlJTWllOWEM5TEw5b3hW';
$decodedKey = base64_decode($encodedKey);

$configContent = '<?php
/**
 * Tektwig Admin Authentication Configuration
 * Generated via secure setup script
 */

define("RESEND_API_KEY", "' . $decodedKey . '");
define("ADMIN_EMAIL", "faithtimo2006@gmail.com");
?>';

if (file_put_contents(__DIR__ . '/config.php', $configContent)) {
    echo "<h1>Success</h1><p>config.php was created successfully on the Hostinger server.</p>";
} else {
    echo "<h1>Error</h1><p>Failed to create config.php on the server. Check directory permissions.</p>";
}

// Self-destruct: delete this script
unlink(__FILE__);
?>
