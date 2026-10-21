package com.ams.amsbackend.repository;

import com.ams.amsbackend.model.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {
    List<Announcement> findTop30ByAudienceInOrderByCreatedAtDesc(Collection<String> audiences);
    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}