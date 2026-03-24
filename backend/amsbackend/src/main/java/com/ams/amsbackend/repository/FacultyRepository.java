package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    Optional<Faculty> findByUserId(String userId);
    List<Faculty> findAll();
}
