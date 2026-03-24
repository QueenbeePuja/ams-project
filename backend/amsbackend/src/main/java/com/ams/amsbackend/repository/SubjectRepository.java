package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findBySemester(int semester);
}
