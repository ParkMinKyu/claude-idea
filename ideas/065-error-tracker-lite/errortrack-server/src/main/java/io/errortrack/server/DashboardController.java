package io.errortrack.server;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@Controller
public class DashboardController {

    private final IssueStore store;

    public DashboardController(IssueStore store) {
        this.store = store;
    }

    @GetMapping("/")
    public String index(Model model) {
        model.addAttribute("issues", store.list());
        model.addAttribute("issueCount", store.totalIssues());
        model.addAttribute("eventCount", store.totalEvents());
        return "issues";
    }

    @GetMapping("/issues/{fingerprint}")
    public String detail(@PathVariable String fingerprint, Model model) {
        IssueStore.Issue issue = store.find(fingerprint);
        if (issue == null) {
            return "redirect:/";
        }
        model.addAttribute("issue", issue);
        model.addAttribute("events", issue.events());
        return "issue-detail";
    }
}
