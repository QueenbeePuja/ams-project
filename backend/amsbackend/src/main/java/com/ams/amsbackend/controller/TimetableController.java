package com.ams.amsbackend.controller;

import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.service.TimetableService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/timetable")
@CrossOrigin
public class TimetableController {
    @Autowired
    private TimetableService service;
    @PostMapping
    public ResponseEntity<?> save(@RequestBody Map<String,Object> payload) {
    int semester = Integer.parseInt(payload.get("semester").toString());
        List<Map<String,Object>> data =
                (List<Map<String,Object>>) payload.get("timetable");
        List<Timetable> list = new ArrayList<>();
        for (Map<String,Object> item: data){
            Timetable t = new Timetable();

            t.setDay(item.get("day").toString());
            t.setTimeSlot(item.get("time").toString());
            t.setSemester(semester);
            t.setRoom(item.get("room").toString());
            t.setSlotType(item.get("slotType").toString());
            t.setSubject(item.get("course").toString());
            t.setFaculty(item.get("faculty").toString());

            if (t.getFaculty().isEmpty() || t.getSubject().isEmpty()) {
                continue; // skip invalid entries
            }
            list.add(t);
        }
        System.out.println("Saving timetable: " + list.size() + " entries");
        try {
            service.saveTimetable(list);
            return ResponseEntity.ok("Timetable saved successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
