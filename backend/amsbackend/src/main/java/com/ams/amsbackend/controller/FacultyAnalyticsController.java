package com.ams.amsbackend.controller;

import com.ams.amsbackend.service.FacultyAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/faculty/analytics")
@CrossOrigin
public class FacultyAnalyticsController {

    @Autowired
    private FacultyAnalyticsService service;

    @GetMapping("/summary")
    public ResponseEntity<?> summary(Authentication authentication) {
        return service.getSummary(authentication.getName())
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).body("Faculty profile not found"));
    }
}