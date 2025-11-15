package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConceptDto {
    private Long id;
    private Long subUnitId;
    private String subUnitName;
    private String name;
    private String displayName;
    private String description;
    private Integer orderIndex;
    private Long questionCount;
    private Long veryEasyCount;
    private Long easyCount;
    private Long mediumCount;
    private Long hardCount;
    private Long veryHardCount;
}
