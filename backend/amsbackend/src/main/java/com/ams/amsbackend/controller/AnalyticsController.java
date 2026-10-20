package com.ams.amsbackend.controller;

import com.ams.amsbackend.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/student/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<?> studentSummary(Authentication authentication) {
        var summary = analyticsService.getStudentSummary(authentication.getName());
        if (summary.isEmpty()) {
            return ResponseEntity.status(404).body("Student profile not found");
        }
        return ResponseEntity.ok(summary.get());
    }
}