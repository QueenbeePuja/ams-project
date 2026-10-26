package com.ams.amsbackend.controller;

import com.ams.amsbackend.dto.AttendancePercentageDTO;
import com.ams.amsbackend.model.Attendance;
import com.ams.amsbackend.model.AttendanceSession;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.Subject;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.AttendanceSessionRepository;
import com.ams.amsbackend.repository.StudentRepository;
import com.ams.amsbackend.repository.SubjectRepository;
import com.ams.amsbackend.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.ams.amsbackend.service.QrTokenService;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {
    @Autowired
    private AttendanceRepository attendanceRepository;
    @Autowired
    private AttendanceSessionRepository attendanceSessionRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private SubjectRepository subjectRepository;
    @Autowired
    private AttendanceService attendanceService;
    @Autowired
    private QrTokenService qrTokenService;

    @PostMapping("/mark")
    public ResponseEntity<?> markAttendance(@RequestBody List<Attendance> attendanceList){
        for (Attendance attendance : attendanceList){
            boolean exists = attendanceRepository
                    .existsByStudentAndSubjectAndDate(
                            attendance.getStudent(),
                            attendance.getSubject(),
                            attendance.getDate()
                    );
            if(exists){
                return ResponseEntity.badRequest()
                        .body("Attendance already marked for student ID: "
                        + attendance.getStudent().getId());
            }
        }
        attendanceRepository.saveAll(attendanceList);
        return ResponseEntity.ok("Attendance Saved");

    }
    @PostMapping("/start-session")
    public ResponseEntity<?> startSession(@RequestParam Long subjectId,
                                          Authentication authentication){

        String role = authentication.getAuthorities().iterator().next().getAuthority();
        if(!role.equals("ROLE_FACULTY")){
            return ResponseEntity.status(403).body("Only faculty can start session");
        }
        String sessionId = UUID.randomUUID().toString();
        AttendanceSession session = new AttendanceSession();
        session.setSessionId(sessionId);
        session.setSubjectId(subjectId);
        session.setDate(LocalDate.now());
        session.setExpiryTime(LocalTime.now().plusMinutes(2));
        session.setSecret(UUID.randomUUID().toString() + java.util.UUID.randomUUID());
        attendanceSessionRepository.save(session);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/qr-token")
    public ResponseEntity<?> getQrToken(@RequestParam String sessionId,
                                        org.springframework.security.core.Authentication authentication) {

        String role = authentication.getAuthorities().iterator().next().getAuthority();
        if (!role.equals("ROLE_FACULTY")) {
            return ResponseEntity.status(403).body("Only faculty can get the QR token");
        }

        AttendanceSession session = attendanceSessionRepository.findById(sessionId).orElse(null);
        if (session == null || session.getSecret() == null) {
            return ResponseEntity.badRequest().body("Invalid session");
        }
        if (session.getExpiryTime().isBefore(java.time.LocalTime.now())) {
            return ResponseEntity.badRequest().body("Session expired");
        }

        return ResponseEntity.ok(qrTokenService.generate(session.getSecret(), sessionId));
    }

    @PostMapping("/scan")
    public ResponseEntity<?> scanAttendance(@RequestParam String sessionId,@RequestParam String token,
                                            org.springframework.security.core.Authentication authentication) {

        // Student identity comes from the JWT, never from the request
        Student student = studentRepository.findByUserId(authentication.getName()).orElse(null);
        if (student == null) {
            return ResponseEntity.status(403).body("Only students can mark attendance");
        }

        // find session
        AttendanceSession session = attendanceSessionRepository
                .findById(sessionId)
                .orElse(null);
        if (session == null) {
            return ResponseEntity.badRequest().body("Invalid session");
        }

        // check expiry
        if (session.getExpiryTime().isBefore(java.time.LocalTime.now())) {
            return ResponseEntity.badRequest().body("Session expired");
        }
        // the QR must be a live, current one
        if (!qrTokenService.isValid(session.getSecret(), sessionId, token)) {
            return ResponseEntity.badRequest().body("QR expired. Scan the live QR on the screen.");
        }

        Subject subject = subjectRepository.findById(session.getSubjectId()).orElse(null);
        if (subject == null) {
            return ResponseEntity.badRequest().body("Invalid data");
        }

        // student must belong to the semester this subject is taught in
        if (student.getCurrentSemester() != subject.getSemester()) {
            return ResponseEntity.status(403).body("This class is not for your semester");
        }

        // check duplicates
        boolean exist = attendanceRepository
                .existsByStudentAndSubjectAndDate(student, subject, session.getDate());
        if (exist) {
            return ResponseEntity.badRequest().body("Already marked");
        }

        // save attendance
        Attendance attendance = new Attendance();
        attendance.setStudent(student);
        attendance.setSubject(subject);
        attendance.setDate(session.getDate());
        attendance.setStatus(Attendance.AttendanceStatus.PRESENT);
        attendance.setSessionId(sessionId);
        attendanceRepository.save(attendance);

        return ResponseEntity.ok("Attendance marked via QR");
    }

    @PostMapping("/end-session")
    public ResponseEntity<?> endSession(@RequestParam String sessionId ){
        AttendanceSession session = attendanceSessionRepository
                .findById(sessionId).orElse(null);

        if(session == null){
            return  ResponseEntity.badRequest().body("Invalid session");
        }
        Subject subject = subjectRepository
                .findById(session.getSubjectId()).orElse(null);
        if(subject == null){
            return ResponseEntity.badRequest().body("Invalid subject");
        }
        int semester = subject.getSemester();
        //geting all students
        List<Student> students = studentRepository.findByCurrentSemester(semester);



        for(Student student : students){
            boolean exist = attendanceRepository
                    .existsByStudentAndSubjectAndDate(
                            student,
                            subject,
                            session.getDate()
                    );
            if(!exist){
                Attendance attendance = new Attendance();
                attendance.setStudent(student);
                attendance.setSubject(subject);
                attendance.setDate(session.getDate());
                attendance.setStatus(Attendance.AttendanceStatus.ABSENT);
                attendance.setSessionId(sessionId);

                attendanceRepository.save(attendance);
            }
        }
        return ResponseEntity.ok("Session ended. Absentees marked.");
    }
@GetMapping("/count")
    public ResponseEntity<?> getAttendanceCount(@RequestParam String sessionId){
        long present = attendanceRepository
                .countBySessionIdAndStatus(sessionId,Attendance.AttendanceStatus.PRESENT);
        long total = attendanceRepository.countBySessionId(sessionId);

        return ResponseEntity.ok(
                Map.of(
                        "present",present,
                        "total", total
                )
        );

    }
    @GetMapping("/percentage")
    public ResponseEntity<?> getPercentage(@RequestParam(required = false) Long studentId,
                                           Authentication authentication) {
        boolean staff = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY")
                        || a.getAuthority().equals("ROLE_ADMIN"));

        Long targetId;
        if (staff) {
            if (studentId == null) {
                return ResponseEntity.badRequest().body("studentId is required");
            }
            targetId = studentId;
        } else {
            // a student only ever sees their own data, whatever id the browser sends
            Student me = studentRepository.findByUserId(authentication.getName()).orElse(null);
            if (me == null) {
                return ResponseEntity.status(403).body("Student profile not found");
            }
            targetId = me.getId();
        }

        return ResponseEntity.ok(attendanceService.getPercentage(targetId));
    }

}
