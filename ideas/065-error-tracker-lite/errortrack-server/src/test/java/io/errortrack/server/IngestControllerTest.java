package io.errortrack.server;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class IngestControllerTest {

    @Autowired MockMvc mvc;
    @Autowired IssueStore store;

    @BeforeEach
    void reset() {
        store.clear();
    }

    @Test
    void ingestsAndGroupsByFingerprint() throws Exception {
        String payload1 = """
                {
                  "event_id":"e1",
                  "exception_class":"java.lang.RuntimeException",
                  "message":"boom",
                  "fingerprint":"abc",
                  "environment":"test",
                  "release":"1.0.0"
                }
                """;
        String payload2 = """
                {
                  "event_id":"e2",
                  "exception_class":"java.lang.RuntimeException",
                  "message":"boom",
                  "fingerprint":"abc"
                }
                """;
        String payload3 = """
                {
                  "event_id":"e3",
                  "exception_class":"java.lang.IllegalStateException",
                  "message":"other",
                  "fingerprint":"xyz"
                }
                """;

        mvc.perform(post("/ingest").header("X-Api-Key", "k").contentType("application/json").content(payload1))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.event_id").value("e1"));
        mvc.perform(post("/ingest").header("X-Api-Key", "k").contentType("application/json").content(payload2))
                .andExpect(status().isAccepted());
        mvc.perform(post("/ingest").header("X-Api-Key", "k").contentType("application/json").content(payload3))
                .andExpect(status().isAccepted());

        assertThat(store.totalIssues()).isEqualTo(2);
        assertThat(store.totalEvents()).isEqualTo(3);
        assertThat(store.find("abc").eventCount()).isEqualTo(2);
        assertThat(store.find("xyz").eventCount()).isEqualTo(1);
    }

    @Test
    void rejectsWithoutApiKey() throws Exception {
        mvc.perform(post("/ingest").contentType("application/json").content("{}"))
                .andExpect(status().isUnauthorized());
    }
}
