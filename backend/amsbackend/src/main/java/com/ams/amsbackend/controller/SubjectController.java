package com.ams.amsbackend.controller;

import com.ams.amsbackend.model.Subject;
import com.ams.amsbackend.repository.SubjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/subjects")
@CrossOrigin
public class SubjectController {
    @Autowired
    private SubjectRepository repository;

    @GetMapping("/{semester}")
    public List<Subject> getSubjects(@PathVariable int semester){
        return repository.findBySemester(semester);
    }


}
