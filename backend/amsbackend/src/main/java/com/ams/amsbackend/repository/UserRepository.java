package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {

    Optional<User> findByUserId(String userId);
}
