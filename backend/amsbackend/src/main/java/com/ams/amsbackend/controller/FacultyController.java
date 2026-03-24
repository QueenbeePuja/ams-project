package com.ams.amsbackend.controller;

import com.ams.amsbackend.model.Faculty;
import com.ams.amsbackend.repository.FacultyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/faculty")
@CrossOrigin
public class FacultyController {
    @Autowired
    private FacultyRepository repository;
    @GetMapping
    public List<Faculty> getAllFaculty(){
        return repository.findAll();
    }
}
