package com.ams.amsbackend.service;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
public class QrTokenService {

    // Each token is valid for one 10-second window, plus the previous window
    private static final long WINDOW_SECONDS = 10;

    public String generate(String secret, String sessionId) {
        return hmac(secret, sessionId, currentWindow());
    }

    public boolean isValid(String secret, String sessionId, String token) {
        if (secret == null || token == null) {
            return false;
        }
        long window = currentWindow();
        return matches(hmac(secret, sessionId, window), token)
                || matches(hmac(secret, sessionId, window - 1), token);
    }

    private long currentWindow() {
        return System.currentTimeMillis() / 1000 / WINDOW_SECONDS;
    }

    private String hmac(String secret, String sessionId, long window) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] out = mac.doFinal((sessionId + ":" + window).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < 8; i++) {          // first 8 bytes = 16 hex characters
                sb.append(String.format("%02x", out[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Could not generate QR token", e);
        }
    }

    private boolean matches(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8));
    }
}