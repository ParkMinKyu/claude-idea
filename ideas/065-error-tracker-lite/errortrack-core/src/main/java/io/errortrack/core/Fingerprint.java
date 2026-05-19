package io.errortrack.core;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

public final class Fingerprint {

    private Fingerprint() {}

    /**
     * Stable hash for an exception based on the exception class and the
     * top frames of its stack trace. Line numbers are intentionally excluded
     * so that line shifts caused by unrelated edits do not break grouping.
     */
    public static String of(Throwable t) {
        if (t == null) return "null";
        StringBuilder sb = new StringBuilder();
        sb.append(rootClassName(t)).append('|');
        StackTraceElement[] frames = topFrames(t.getStackTrace(), 5);
        for (StackTraceElement f : frames) {
            sb.append(f.getClassName()).append('#').append(f.getMethodName()).append('|');
        }
        return sha1(sb.toString());
    }

    private static String rootClassName(Throwable t) {
        Throwable root = t;
        while (root.getCause() != null && root.getCause() != root) {
            root = root.getCause();
        }
        return root.getClass().getName();
    }

    private static StackTraceElement[] topFrames(StackTraceElement[] frames, int n) {
        if (frames == null || frames.length == 0) return new StackTraceElement[0];
        int len = Math.min(frames.length, n);
        StackTraceElement[] out = new StackTraceElement[len];
        System.arraycopy(frames, 0, out, 0, len);
        return out;
    }

    private static String sha1(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-1");
            byte[] digest = md.digest(s.getBytes());
            StringBuilder hex = new StringBuilder();
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 not available", e);
        }
    }
}
