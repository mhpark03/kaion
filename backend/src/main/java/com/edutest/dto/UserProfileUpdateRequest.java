package com.edutest.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    private String fullName;
    private String email;
    private Long levelId;
    private Long gradeId;
    private Long subjectId;
    private Long unitId;
    private Long subUnitId;
    private String proficiencyLevel;
    private String currentPassword;
    private String newPassword;
}
