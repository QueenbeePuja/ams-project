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
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginUser) {

        Optional<User> userOptional =
                userRepository.findByUserId(
                        loginUser.getUserId());

        if (userOptional.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }

        User user = userOptional.get();

        // 🔥 THIS IS THE FIX
        if (passwordEncoder.matches(loginUser.getPassword(), user.getPassword())) {
            String token = jwtUtil.generateToken(user.getUserId(),user.getRole());
            return ResponseEntity.ok(
                    Map.of(
                            "token", token,
                            "role" , user.getRole(),
                            "userId" , user.getUserId()
                    )
            );
        } else {
            return ResponseEntity.status(401).body("Invalid password");
        }
    }

    @PostMapping("/register")
    public String register(@RequestBody User user) {

        System.out.println("REGISTER API HIT"); // 👈 ADD THIS

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepository.save(user);

        return "User Registered Successfully";
    }

}
