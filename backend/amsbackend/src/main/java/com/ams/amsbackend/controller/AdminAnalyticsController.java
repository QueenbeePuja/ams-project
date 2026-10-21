package com.ams.amsbackend.controller;

import com.ams.amsbackend.dto.AdminAnalyticsDTO.AdminSummary;
import com.ams.amsbackend.service.AdminAnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/analytics")
@CrossOrigin
public class AdminAnalyticsController {

    @Autowired
    private AdminAnalyticsService service;

    @GetMapping("/summary")
    public AdminSummary summary() {
        return service.getSummary();
    }
}