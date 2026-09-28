package com.ams.amsbackend.service;

import com.ams.amsbackend.dto.AttendancePercentageDTO;
import com.ams.amsbackend.model.Student;
import com.ams.amsbackend.repository.AttendancePercentageProjection;
import com.ams.amsbackend.repository.AttendanceRepository;
import com.ams.amsbackend.repository.StudentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AttendanceService {
    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private StudentRepository studentRepository;

    public List<AttendancePercentageDTO> getPercentage(Long studentId){
        Student student = studentRepository.findById(studentId)
                .orElseThrow(()-> new RuntimeException("Student not found"));
        List<AttendancePercentageProjection> stats =
                attendanceRepository.getAttendanceStats(studentId,student.getCurrentSemester());

        List<AttendancePercentageDTO> result = new ArrayList<>();

        for(AttendancePercentageProjection row : stats){

            long present = row.getPresentCount()!= null ? row.getPresentCount() : 0;
            long total = row.getTotalCount() != null ? row.getTotalCount() : 0;
            int percentage = 0;

            if(total>0){
                percentage = (int)Math.round((present*100.0)/total);
            }

            result.add(new AttendancePercentageDTO(
                    row.getSubjectName(),
                    percentage,
                    total == 0 ? "N/A" : percentage + "%"
                    ));
        }
        return result;
    }
}

