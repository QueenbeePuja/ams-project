package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    Optional<Student> findByUserId(String userId);
    Optional<Student> findByCollegeEmail( String collegeEmail);
    List<Student> findByCurrentSemester(int semester);
}
