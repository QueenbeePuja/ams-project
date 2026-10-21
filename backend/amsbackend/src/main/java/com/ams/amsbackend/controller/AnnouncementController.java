package com.ams.amsbackend.controller;

import com.ams.amsbackend.model.Announcement;
import com.ams.amsbackend.repository.AnnouncementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/announcements")
@CrossOrigin
public class AnnouncementController {

    private static final Set<String> AUDIENCES = Set.of("FACULTY", "STUDENTS", "BOTH");

    @Autowired
    private AnnouncementRepository repository;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body,
                                    Authentication authentication) {
        String title = body.getOrDefault("title", "").trim();
        String message = body.getOrDefault("message", "").trim();
        String audience = body.getOrDefault("audience", "").trim().toUpperCase();

        if (!AUDIENCES.contains(audience))
            return ResponseEntity.badRequest().body("Choose an audience");
        if (title.isEmpty() || title.length() > 150)
            return ResponseEntity.badRequest().body("Title is required (max 150 characters)");
        if (message.isEmpty() || message.length() > 2000)
            return ResponseEntity.badRequest().body("Message is required (max 2000 characters)");

        Announcement a = new Announcement();
        a.setTitle(title);
        a.setMessage(message);
        a.setAudience(audience);
        a.setCreatedAt(LocalDateTime.now(ZoneId.of("Asia/Kolkata")));
        a.setCreatedBy(authentication.getName());

        return ResponseEntity.ok(repository.save(a));
    }

    @GetMapping
    public List<Announcement> list(Authentication authentication) {
        boolean admin = hasRole(authentication, "ROLE_ADMIN");
        boolean faculty = hasRole(authentication, "ROLE_FACULTY");

        List<String> audiences;
        if (admin) audiences = List.of("FACULTY", "STUDENTS", "BOTH");
        else if (faculty) audiences = List.of("FACULTY", "BOTH");
        else audiences = List.of("STUDENTS", "BOTH");

        return repository.findTop30ByAudienceInOrderByCreatedAtDesc(audiences);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.ok("Deleted");
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
    }
}