package com.ams.amsbackend.service;

import com.ams.amsbackend.model.Timetable;
import com.ams.amsbackend.repository.TimetableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ams.amsbackend.model.Faculty;

import java.util.List;

@Service
public class TimetableService {
    @Autowired
    private TimetableRepository repository;
    public void saveTimetable(List<Timetable> entries) {
        for (Timetable t : entries) {
            boolean conflict = repository.existsByFacultyAndDayAndTimeSlot(
                t.getFaculty(),
                t.getDay(),
                t.getTimeSlot()
            );
            if(conflict){
                throw  new RuntimeException(
                        "Faculty already assigned at" + t.getDay() + " "+ t.getTimeSlot()
                );
            }
            repository.save(t);
        }
    }
}
