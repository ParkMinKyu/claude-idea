package io.errortrack.core;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class FingerprintTest {

    @Test
    void sameStackProducesSameFingerprint() {
        String a = Fingerprint.of(throwHere());
        String b = Fingerprint.of(throwHere());
        assertThat(a).isEqualTo(b);
    }

    @Test
    void differentExceptionClassProducesDifferentFingerprint() {
        String a = Fingerprint.of(new IllegalStateException("x"));
        String b = Fingerprint.of(new RuntimeException("x"));
        assertThat(a).isNotEqualTo(b);
    }

    @Test
    void nullThrowableIsHandled() {
        assertThat(Fingerprint.of(null)).isEqualTo("null");
    }

    @Test
    void causeChainTopMatters() {
        Throwable nested = new RuntimeException("outer", new IllegalArgumentException("inner"));
        Throwable nestedDifferentRoot = new RuntimeException("outer", new IllegalStateException("inner"));
        assertThat(Fingerprint.of(nested)).isNotEqualTo(Fingerprint.of(nestedDifferentRoot));
    }

    private RuntimeException throwHere() {
        return new RuntimeException("test");
    }
}
