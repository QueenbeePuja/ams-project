package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.AdminAnalyticsDTO.TodayStats;
import com.ams.amsbackend.repository.AnnouncementRepository;
import com.ams.amsbackend.repository.AttendanceSessionRepository;
import com.ams.amsbackend.repository.TimetableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.TextStyle;
import java.util.Locale;

@Service
public class AdminTodayService {

    @Autowired private TimetableRepository timetableRepository;
    @Autowired private AttendanceSessionRepository sessionRepository;
    @Autowired private AnnouncementRepository announcementRepository;

    public TodayStats getToday() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Kolkata"));
        String day = today.getDayOfWeek().getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        long classes = timetableRepository.countByDayIgnoreCaseAndSlotTypeIgnoreCase(day, "CLASS");
        long sessions = sessionRepository.countByDate(today);
        long pending = Math.max(0, classes - sessions);
        long announcements = announcementRepository.countByCreatedAtBetween(
                today.atStartOfDay(), today.plusDays(1).atStartOfDay());

        return new TodayStats(day, classes, sessions, pending, announcements);
    }
}