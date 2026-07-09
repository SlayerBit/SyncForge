package com.syncforge.common.util;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class FractionalIndexTest {

    @Test
    void shouldGenerateMidpoint_whenAdjacentOrSpacedValues() {
        // Space exists between 'A' and 'C'
        String mid1 = FractionalIndex.midpoint("A", "C");
        assertThat(mid1).isEqualTo("B");

        // Start element (before is null, after is a large value like "z")
        String midStart = FractionalIndex.midpoint(null, "z");
        assertThat(midStart).isLessThan("z");

        // End element (after is null)
        String midEnd = FractionalIndex.midpoint("A", null);
        assertThat(midEnd).isGreaterThan("A");
    }

    @Test
    void shouldGenerateInitialPositions_whenCountSpecified() {
        List<String> positions = FractionalIndex.initialPositions(5);
        assertThat(positions).hasSize(5);
        for (int i = 0; i < positions.size() - 1; i++) {
            assertThat(positions.get(i)).isLessThan(positions.get(i + 1));
        }
    }
}
