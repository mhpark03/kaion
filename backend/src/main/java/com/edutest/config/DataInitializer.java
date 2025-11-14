package com.edutest.config;

import com.edutest.dto.*;
import com.edutest.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final LevelService levelService;
    private final GradeService gradeService;
    private final UnitService unitService;
    private final SubUnitService subUnitService;
    private final ConceptService conceptService;

    @Override
    public void run(String... args) throws Exception {
        // Only initialize if database is empty
        if (!levelService.getAllLevels().isEmpty()) {
            log.info("Database already contains data. Skipping initialization.");
            return;
        }

        log.info("Starting data initialization...");

        try {
            initializeEducationalContent();
            log.info("Data initialization completed successfully!");
        } catch (Exception e) {
            log.error("Error during data initialization", e);
            throw e;
        }
    }

    private void initializeEducationalContent() {
        // Create Levels
        Map<String, Long> levels = createLevels();

        // Create Grades and subsequent hierarchy
        createElementarySchool(levels.get("초등학교"));
        createMiddleSchool(levels.get("중학교"));
        createHighSchool(levels.get("고등학교"));
    }

    private Map<String, Long> createLevels() {
        Map<String, Long> levelMap = new HashMap<>();

        String[] levelNames = {"초등학교", "중학교", "고등학교"};
        int rank = 1;

        for (String name : levelNames) {
            LevelDto dto = LevelDto.builder()
                    .name(name)
                    .difficultyRank(rank++)
                    .build();
            LevelDto level = levelService.createLevel(dto);
            levelMap.put(name, level.getId());
            log.info("Created level: {}", name);
        }

        return levelMap;
    }

    private void createElementarySchool(Long levelId) {
        // E1 (초등학교 1학년)
        Long e1Id = createGrade(levelId, "E1");
        createUnit(e1Id, "우리와 사계절",
            Map.of("계절의 변화와 생활", Arrays.asList("날씨 관찰", "계절 특징", "오감 활용 탐색")));

        // E2 (초등학교 2학년)
        Long e2Id = createGrade(levelId, "E2");
        createUnit(e2Id, "동식물 탐색",
            Map.of("동식물의 특징과 성장", Arrays.asList("생김새 비교", "동물 분류", "식물 성장 과정")));

        // E3 (초등학교 3학년)
        Long e3Id = createGrade(levelId, "E3");
        createUnit(e3Id, "물질과 우리 생활",
            Map.of("물질의 성질", Arrays.asList("물질 특징", "고체와 액체", "상태 변화", "혼합물과 분리")));
        createUnit(e3Id, "지구와 우주",
            Map.of("지표의 변화", Arrays.asList("흙과 자갈", "흐르는 물", "바람", "침식과 퇴적")));

        // E4 (초등학교 4학년)
        Long e4Id = createGrade(levelId, "E4");
        createUnit(e4Id, "생명의 연속성",
            Map.of("식물의 한살이", Arrays.asList("씨앗과 발아", "꽃과 열매", "생장 과정", "생존 전략")));
        createUnit(e4Id, "운동과 에너지",
            Map.of("소리의 성질", Arrays.asList("소리의 발생", "전달", "크기와 높이", "반사와 흡수")));

        // E5 (초등학교 5학년)
        Long e5Id = createGrade(levelId, "E5");
        createUnit(e5Id, "생물과 환경",
            Map.of("생태계와 환경", Arrays.asList("생물 요소", "비생물 요소", "먹이 사슬", "먹이 그물", "환경 변화 영향")));
        createUnit(e5Id, "물질의 용해와 분리",
            Map.of("용해와 용액", Arrays.asList("용해 현상", "용질과 용매", "용해도", "농도", "용액의 성질")));

        // E6 (초등학교 6학년)
        Long e6Id = createGrade(levelId, "E6");
        createUnit(e6Id, "지구와 달의 운동",
            Map.of("지구와 달의 관계", Arrays.asList("지구 자전", "공전", "달의 위상 변화", "일식과 월식")));
        createUnit(e6Id, "전기의 이용",
            Map.of("전기 회로", Arrays.asList("전구 연결", "직렬과 병렬", "전자석", "자기장")));
    }

    private void createMiddleSchool(Long levelId) {
        // M1 (중학교 1학년)
        Long m1Id = createGrade(levelId, "M1");
        createUnit(m1Id, "과학과 나의 미래",
            Map.of("과학의 본성", Arrays.asList("과학적 탐구", "과학과 기술의 관계", "과학자의 태도")));
        createUnit(m1Id, "생물의 다양성",
            Map.of("생물의 분류와 다양성", Arrays.asList("생물 분류 기준", "계통 분류", "생물 다양성", "보전의 중요성")));

        // M2 (중학교 2학년)
        Long m2Id = createGrade(levelId, "M2");
        createUnit(m2Id, "물질의 구성",
            Map.of("원소와 화합물", Arrays.asList("원소 기호", "주기율표", "화합물 생성", "분자식", "이온")));
        createUnit(m2Id, "전기와 자기",
            Map.of("전류와 전압", Arrays.asList("전류의 세기", "전압과 저항", "옴의 법칙", "전력과 전력량")));

        // M3 (중학교 3학년)
        Long m3Id = createGrade(levelId, "M3");
        createUnit(m3Id, "화학 반응의 규칙과 에너지 변화",
            Map.of("화학 반응식", Arrays.asList("질량 보존 법칙", "일정 성분비 법칙", "기체 반응 법칙", "발열과 흡열 반응")));
        createUnit(m3Id, "생식과 유전",
            Map.of("세포 분열과 유전", Arrays.asList("체세포 분열", "감수 분열", "염색체", "유전 법칙", "멘델의 유전")));
    }

    private void createHighSchool(Long levelId) {
        // H1 (고등학교 1학년 - 통합과학)
        Long h1Id = createGrade(levelId, "H1");
        createUnit(h1Id, "물질과 규칙성",
            Map.of("우주의 시작과 진화", Arrays.asList("빅뱅 이론", "원소의 생성", "별의 진화", "주기율표 규칙성")));
        createUnit(h1Id, "자연의 구성 물질",
            Map.of("지각과 생명체 구성 물질", Arrays.asList("광물과 암석", "규산염 광물", "탄소 화합물", "단백질과 DNA")));

        // H2 (고등학교 2학년 - 물리학I, 화학I, 생명과학I, 지구과학I)
        Long h2Id = createGrade(levelId, "H2");
        createUnit(h2Id, "역학과 에너지",
            Map.of("힘과 운동", Arrays.asList("뉴턴 운동 법칙", "운동량 보존", "충돌", "등가속도 운동")));
        createUnit(h2Id, "화학 결합과 분자의 세계",
            Map.of("화학 결합", Arrays.asList("이온 결합", "공유 결합", "금속 결합", "분자 구조", "극성")));
        createUnit(h2Id, "생명 시스템",
            Map.of("세포와 생명의 연속성", Arrays.asList("세포막 구조", "세포 호흡", "광합성", "유전자 발현", "유전병")));
        createUnit(h2Id, "지구 시스템",
            Map.of("지구 환경 변화", Arrays.asList("판 구조론", "대기 순환", "해류", "기후 변화", "엘니뇨")));

        // H3 (고등학교 3학년 - 물리학II, 화학II, 생명과학II, 지구과학II)
        Long h3Id = createGrade(levelId, "H3");
        createUnit(h3Id, "고급 물리학",
            Map.of("전자기학", Arrays.asList("전기장과 자기장", "전자기 유도", "맥스웰 방정식", "전자기파")));
        createUnit(h3Id, "고급 화학",
            Map.of("화학 평형과 반응 속도", Arrays.asList("평형 상수", "르샤틀리에 원리", "반응 속도식", "활성화 에너지", "촉매")));
        createUnit(h3Id, "고급 생명과학",
            Map.of("생명 공학과 진화", Arrays.asList("DNA 재조합", "유전자 클로닝", "PCR 기술", "진화의 증거", "자연선택설")));
        createUnit(h3Id, "고급 지구과학",
            Map.of("우주와 천체", Arrays.asList("별의 특성", "H-R도", "외계 행성 탐사", "우주론", "암흑 물질과 에너지")));
    }

    private Long createGrade(Long levelId, String name) {
        GradeDto dto = GradeDto.builder()
                .name(name)
                .levelId(levelId)
                .build();
        GradeDto grade = gradeService.createGrade(dto);
        log.info("Created grade: {}", name);
        return grade.getId();
    }

    private void createUnit(Long gradeId, String unitName, Map<String, List<String>> subUnitsWithConcepts) {
        UnitDto unitDto = UnitDto.builder()
                .name(unitName)
                .gradeId(gradeId)
                .build();
        UnitDto unit = unitService.createUnit(unitDto);
        log.info("Created unit: {}", unitName);

        for (Map.Entry<String, List<String>> entry : subUnitsWithConcepts.entrySet()) {
            createSubUnit(unit.getId(), entry.getKey(), entry.getValue());
        }
    }

    private void createSubUnit(Long unitId, String subUnitName, List<String> concepts) {
        SubUnitDto subUnitDto = SubUnitDto.builder()
                .name(subUnitName)
                .unitId(unitId)
                .build();
        SubUnitDto subUnit = subUnitService.createSubUnit(subUnitDto);
        log.info("Created subunit: {}", subUnitName);

        for (String conceptName : concepts) {
            createConcept(subUnit.getId(), conceptName);
        }
    }

    private void createConcept(Long subUnitId, String conceptName) {
        ConceptDto conceptDto = ConceptDto.builder()
                .name(conceptName)
                .subUnitId(subUnitId)
                .build();
        conceptService.createConcept(conceptDto);
        log.info("Created concept: {}", conceptName);
    }
}
