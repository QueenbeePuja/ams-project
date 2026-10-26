package com.ams.amsbackend.controller;

import com.ams.amsbackend.dto.RiskDTO.RiskList;
import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.repository.FacultyRepository;
import com.ams.amsbackend.repository.StudentRepository;
import com.ams.amsbackend.repository.TimetableRepository;
import com.ams.amsbackend.service.RiskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

@RestController
@CrossOrigin
public class RiskController {

    @Autowired private RiskService riskService;
    @Autowired private StudentRepository studentRepository;
    @Autowired private FacultyRepository facultyRepository;
    @Autowired private TimetableRepository timetableRepository;

    // student: own risk
    @GetMapping("/api/student/analytics/risk")
    public ResponseEntity<?> mine(Authentication authentication) {
        return studentRepository.findByUserId(authentication.getName())
                .<ResponseEntity<?>>map(s -> ResponseEntity.ok(riskService.assess(s)))
                .orElse(ResponseEntity.status(404).body("Student profile not found"));
    }

    // faculty: students in the semesters they teach
    @GetMapping("/api/faculty/analytics/risk")
    public ResponseEntity<?> forFaculty(Authentication authentication,
                                        @RequestParam(defaultValue = "false") boolean all) {
        Faculty faculty = facultyRepository.findByUserId(authentication.getName()).orElse(null);
        if (faculty == null) return ResponseEntity.status(404).body("Faculty profile not found");

        Set<Integer> semesters = new TreeSet<>();
        for (Timetable t : timetableRepository.findByFacultyId(faculty.getId())) {
            if (t.getSubject() != null) semesters.add(t.getSubject().getSemester());
        }

        List<Student> students = new ArrayList<>();
        for (int sem : semesters) students.addAll(studentRepository.findByCurrentSemester(sem));

        RiskList list = riskService.buildList(riskService.assessAll(students), all);
        return ResponseEntity.ok(list);
    }

    // admin: everyone, optionally filtered
    @GetMapping("/api/admin/analytics/risk")
    public RiskList forAdmin(@RequestParam(required = false) String department,
                             @RequestParam(required = false) Integer semester,
                             @RequestParam(defaultValue = "false") boolean all) {
        List<Student> students = new ArrayList<>();
        for (Student s : studentRepository.findAll()) {
            boolean deptOk = department == null || department.isBlank()
                    || department.equalsIgnoreCase("all")
                    || (s.getDepartment() != null && s.getDepartment().trim().equalsIgnoreCase(department.trim()));
            boolean semOk = semester == null || s.getCurrentSemester() == semester;
            if (deptOk && semOk) students.add(s);
        }
        return riskService.buildList(riskService.assessAll(students), all);
    }
}