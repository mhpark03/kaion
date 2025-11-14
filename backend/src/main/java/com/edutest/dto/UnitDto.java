package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnitDto {
    private Long id;
    private Long gradeId;
    private String gradeName;
    private String name;
    private String displayName;
    private String description;
    private Integer orderIndex;
}
