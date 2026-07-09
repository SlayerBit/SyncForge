package com.syncforge.common.util;

import java.util.ArrayList;
import java.util.List;

public class FractionalIndex {

    private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    /**
     * Generate a position string between two existing positions.
     * @param before Position before (null for start)
     * @param after Position after (null for end)
     * @return New position that sorts between before and after
     */
    public static String midpoint(String before, String after) {
        if (before == null) before = "";
        if (after == null) after = repeat(String.valueOf(ALPHABET.charAt(ALPHABET.length() - 1)), before.length() + 1);

        // Find first differing character position
        int commonLength = Math.min(before.length(), after.length());
        for (int i = 0; i < commonLength; i++) {
            int beforeIdx = ALPHABET.indexOf(before.charAt(i));
            int afterIdx = ALPHABET.indexOf(after.charAt(i));
            if (afterIdx - beforeIdx > 1) {
                // Gap exists — pick midpoint character
                return before.substring(0, i) + ALPHABET.charAt((beforeIdx + afterIdx) / 2);
            } else if (afterIdx - beforeIdx == 1) {
                // Adjacent — append midpoint to 'before' prefix
                return before.substring(0, i + 1) + midpoint("", after.substring(i + 1));
            }
        }
        // Extend with midpoint character
        return before + ALPHABET.charAt(ALPHABET.length() / 2);
    }

    /**
     * Generate initial positions for N items.
     */
    public static List<String> initialPositions(int count) {
        List<String> positions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            positions.add(String.valueOf(ALPHABET.charAt((i + 1) * (ALPHABET.length() / (count + 1)))));
        }
        return positions;
    }

    private static String repeat(String str, int times) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < times; i++) {
            sb.append(str);
        }
        return sb.toString();
    }
}
