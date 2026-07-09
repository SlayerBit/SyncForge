package com.syncforge.common.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public class GravatarUtils {

    public static String getAvatarUrl(String email) {
        if (email == null) {
            return "";
        }
        String cleanEmail = email.trim().toLowerCase();
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            byte[] array = md.digest(cleanEmail.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : array) {
                sb.append(Integer.toHexString((b & 0xFF) | 0x100), 1, 3);
            }
            return "https://www.gravatar.com/avatar/" + sb.toString() + "?s=200&d=identicon";
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("MD5 digest algorithm not available", e);
        }
    }
}
