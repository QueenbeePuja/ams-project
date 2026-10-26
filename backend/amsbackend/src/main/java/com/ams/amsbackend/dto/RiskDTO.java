package com.ams.amsbackend.dto;

import java.util.List;

public class RiskDTO {

    public record RiskResult(String userId, String name, int semester,
                             String risk, int score,
                             double currentPercent, double recentPercent, double projectedPercent,
                             int remainingClasses, int mustAttend, boolean reachable,
                             String reason) {}

    public record RiskList(int high, int medium, int low, int insufficient,
                           List<RiskResult> students) {}
}