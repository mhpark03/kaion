package com.edutest.dto;

import lombok.Data;

@Data
public class RegisterRequest {
    private String username;
    private String password;
    private String email;
    private String fullName;
    private String role; // STUDENT, TEACHER, ADMIN
    private Long levelId; // 교육과정 ID
    private Long gradeId; // 학년 ID
    private String proficiencyLevel; // VERY_EASY, EASY, MEDIUM, HARD, VERY_HARD
}
