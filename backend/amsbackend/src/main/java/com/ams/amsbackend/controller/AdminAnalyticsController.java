package com.ams.amsbackend.controller;

import com.ams.amsbackend.dto.AdminAnalyticsDTO.*;
import com.ams.amsbackend.service.AdminViewService;
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

    @Autowired
    private AdminViewService viewService;
    @Autowired
    private com.ams.amsbackend.service.AdminTodayService todayService;

    @GetMapping("/today")
    public TodayStats today() {
        return todayService.getToday();
    }

    @GetMapping("/filters")
    public Filters filters() {
        return viewService.getFilters();
    }

    @GetMapping("/students")
    public StudentView students(@RequestParam(required = false) String department,
                                @RequestParam(required = false) Integer semester) {
        return viewService.getStudentView(department, semester);
    }

    @GetMapping("/faculty")
    public FacultyView faculty(@RequestParam(required = false) String department,
                               @RequestParam(required = false) Integer semester) {
        return viewService.getFacultyView(department, semester);
    }

    @GetMapping("/summary")
    public AdminSummary summary() {

        return service.getSummary();
    }
}