package com.edutest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubUnitDto {
    private Long id;
    private Long unitId;
    private String unitName;
    private String name;
    private String displayName;
    private String description;
    private Integer orderIndex;
}
