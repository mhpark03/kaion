package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeDto {
    private Long id;
    private Long levelId;
    private String levelName;
    private String name;
    private String displayName;
    private String description;
    private Integer orderIndex;
}
