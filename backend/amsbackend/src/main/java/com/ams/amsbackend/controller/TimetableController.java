package com.ams.amsbackend.controller;

import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.Subject;
import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.repository.FacultyRepository;
import com.ams.amsbackend.repository.SubjectRepository;
import com.ams.amsbackend.repository.TimetableRepository;
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
    @Autowired
    private FacultyRepository facultyRepository;

    @Autowired
    private SubjectRepository subjectRepository;
   @Autowired
   private TimetableRepository repository;

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
            Long facultyId = Long.parseLong(item.get("facultyId").toString());
            Long subjectId = Long.parseLong(item.get("subjectId").toString());

            Faculty faculty = facultyRepository.findById(facultyId)
                    .orElseThrow(() -> new RuntimeException("Faculty not found"));

            Subject subject = subjectRepository.findById(subjectId)
                    .orElseThrow(() -> new RuntimeException("Subject not found"));

            t.setFaculty(faculty);
            t.setSubject(subject);
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
    @GetMapping("/conflicts")
    public List<Long> getConflicts(@RequestParam String day, @RequestParam String time){
        List<Timetable> entries = repository.findByDayAndTimeSlot(day,time);
        return  entries.stream()
                .filter(t -> t.getFaculty() != null)
                .map(t -> t.getFaculty().getId())
                .toList();
    }
    @GetMapping("/faculty/{facultyId}")
    public List<Timetable> getByFaculty (@PathVariable Long facultyId){
        return repository.findByFacultyId(facultyId);
    }
}
