package com.ams.amsbackend.controller;

import com.ams.amsbackend.config.JwtUtil;
import com.ams.amsbackend.model.LoginRequest;
import com.ams.amsbackend.model.User;
import com.ams.amsbackend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/test")
    public String test() {
        return "Protected API working!";
    }
    @GetMapping("/admin/test")
    public Map<String, String> adminTest(){
        return Map.of("message", "Admin only");
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
