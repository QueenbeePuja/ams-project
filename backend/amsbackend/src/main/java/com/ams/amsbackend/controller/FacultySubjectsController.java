package com.ams.amsbackend.controller;

import com.ams.amsbackend.service.FacultyAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/faculty")
public class FacultySubjectsController {

    @Autowired
    private FacultyAnalyticsService facultyAnalyticsService;

    @GetMapping("/my-subjects")
    public ResponseEntity<?> mySubjects(Authentication authentication) {
        return ResponseEntity.ok(
                facultyAnalyticsService.getTeachingSubjects(authentication.getName()));
    }
}