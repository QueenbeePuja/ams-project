package com.ams.amsbackend.controller;

import com.ams.amsbackend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/student")
@CrossOrigin
public class StudentProfileController {

    @Autowired
    private StudentRepository studentRepository;

    @GetMapping("/profile")
    public ResponseEntity<?> profile(Authentication authentication) {
        return studentRepository.findByUserId(authentication.getName())
                .<ResponseEntity<?>>map(s -> ResponseEntity.ok(Map.of(
                        "userId", s.getUserId(),
                        "name", s.getFullName(),
                        "department", s.getDepartment(),
                        "semester", s.getCurrentSemester())))
                .orElse(ResponseEntity.status(404).body("Student profile not found"));
    }
}