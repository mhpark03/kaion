package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private Long levelId;
    private String levelName;
    private Long gradeId;
    private String gradeName;
    private Long subjectId;
    private String subjectName;
    private Long unitId;
    private String unitName;
    private Long subUnitId;
    private String subUnitName;
    private String proficiencyLevel;
}
