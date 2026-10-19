package com.ams.amsbackend.controller;

import com.ams.amsbackend.config.JwtUtil;
import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.model.LoginRequest;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.model.User;
import com.ams.amsbackend.repository.FacultyRepository;
import com.ams.amsbackend.repository.StudentRepository;
import com.ams.amsbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")

public class AuthController {
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private FacultyRepository facultyRepository;

    @GetMapping("/test")
    public String test() {
        return "Protected API working!";
    }
   @PostMapping("/admin/students")
   public ResponseEntity<?> addStudent(@RequestBody Student student){
        if(studentRepository.findByUserId(student.getUserId()).isPresent()){
            return ResponseEntity.badRequest().body("Students already exist");
        }
        if(studentRepository.findByCollegeEmail(student.getCollegeEmail()).isPresent()){
            return ResponseEntity.badRequest().body("Email already exist");
        }
        Student savedStudent = studentRepository.save(student);
        return ResponseEntity.ok(
          Map.of(
                  "message","Student added successfully",
                  "studentId", savedStudent.getId()
          )
        );

   }
   @GetMapping("/admin/students")
   public List<Student> getAllStudents(){
        return studentRepository.findAll();
   }
   @DeleteMapping("/admin/students/user/{userId}")
   public ResponseEntity<String> deleteStudentByUserId(@PathVariable String userId) {

       Optional<Student> studentOpt = studentRepository.findByUserId(userId);

       if (studentOpt.isPresent()) {
           studentRepository.delete(studentOpt.get());
           return ResponseEntity.ok("Student deleted successfully");
       } else {
           return ResponseEntity.status(HttpStatus.NOT_FOUND)
                   .body("Student not found");
       }
   }
   @PostMapping("/admin/faculty")
   public ResponseEntity<Faculty> addFaculty(@RequestBody Faculty faculty){
        return ResponseEntity.ok(facultyRepository.save(faculty));
   }
    @GetMapping("/admin/faculty")
    public List<Faculty> getAllFaculty() {
        return facultyRepository.findAll();
    }
    @DeleteMapping("/admin/faculty/user/{userId}")
    public ResponseEntity<String> deleteFaculty(@PathVariable String userId) {

        Optional<Faculty> facultyOpt = facultyRepository.findByUserId(userId);

        if (facultyOpt.isPresent()) {
            facultyRepository.delete(facultyOpt.get());
            return ResponseEntity.ok("Faculty deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Faculty not found");
        }
    }

    @GetMapping("/student/test")
    public String studentTest(){
        return "Student only";
    }

    @GetMapping("/student/semester/{semester}")
    public List<Student> getStudentsBySemester(@PathVariable int semester) {
        return studentRepository.findByCurrentSemester(semester);
    }

    @GetMapping("/by-userid/{userId}")
    public Student getByUserId(@PathVariable String userId){
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

    }

    @GetMapping("/faculty/by-userid/{userId}")
    public Faculty getFacultyByUserId(@PathVariable String userId) {
        return facultyRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginUser) {
        System.out.println("LOGIN ATTEMPT: " + loginUser.getUserId());
        Optional<User> userOptional =
                userRepository.findByUserId(
                        loginUser.getUserId());
        System.out.println("USER FOUND: " + userOptional.isPresent());
        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }

        User user = userOptional.get();

        // 🔥 THIS IS THE FIX
        if (passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            String token = jwtUtil.generateToken(user.getUserId(),user.getRole());
            Long facultyId = null;

                // ✅ fetch facultyId using userId
            if (user.getRole().equals("Faculty")) {
                Optional<Faculty> facultyOptional =
                        facultyRepository.findByUserId(user.getUserId());

                if (facultyOptional.isPresent()) {
                    facultyId = facultyOptional.get().getId();
                }
            }
            //fetch studentID using userId
            Long studentId = null;

            if (user.getRole().equals("Student")) {
                Optional<Student> studentOptional =
                        studentRepository.findByUserId(user.getUserId());

                if (studentOptional.isPresent()) {
                    studentId = studentOptional.get().getId();
                }
            }


            // ⚠️ use HashMap (Map.of fails with null)
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("role", user.getRole());
            response.put("userId", user.getUserId());

            if (studentId != null) {
                response.put("id", studentId);
            }
            if (facultyId != null) {
                response.put("facultyId", facultyId);
            }

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Invalid password");
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        if (user.getUserId() == null || user.getUserId().isBlank()
                || user.getPassword() == null || user.getPassword().length() < 6) {
            return ResponseEntity.badRequest().body("User ID and a password of at least 6 characters are required");
        }
        if (user.getRole() == null || !List.of("Admin", "Faculty", "Student").contains(user.getRole())) {
            return ResponseEntity.badRequest().body("Role must be Admin, Faculty or Student");
        }
        if (userRepository.findByUserId(user.getUserId()).isPresent()) {
            return ResponseEntity.status(409).body("User ID already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        return ResponseEntity.ok("User Registered Successfully");
    }

}
