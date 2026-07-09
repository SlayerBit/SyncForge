package com.syncforge.common.util;

public class SlugUtils {

    public static String toSlug(String name) {
        if (name == null) {
            return "";
        }
        return name.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }
}
