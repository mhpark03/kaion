package com.edutest.service;

import com.edutest.dto.AuthResponse;
import com.edutest.dto.LoginRequest;
import com.edutest.dto.RegisterRequest;
import com.edutest.dto.UserProfileUpdateRequest;
import com.edutest.dto.UserResponse;
import com.edutest.entity.Grade;
import com.edutest.entity.Level;
import com.edutest.entity.Subject;
import com.edutest.entity.Unit;
import com.edutest.entity.SubUnit;
import com.edutest.entity.User;
import com.edutest.repository.GradeRepository;
import com.edutest.repository.LevelRepository;
import com.edutest.repository.SubjectRepository;
import com.edutest.repository.UnitRepository;
import com.edutest.repository.SubUnitRepository;
import com.edutest.repository.UserRepository;
import com.edutest.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LevelRepository levelRepository;
    private final GradeRepository gradeRepository;
    private final SubjectRepository subjectRepository;
    private final UnitRepository unitRepository;
    private final SubUnitRepository subUnitRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check if username already exists
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create new user
        // fullName이 없으면 username을 사용
        String fullName = (request.getFullName() != null && !request.getFullName().isEmpty())
                ? request.getFullName()
                : request.getUsername();

        // Level과 Grade 조회
        Level level = null;
        Grade grade = null;
        Subject subject = null;
        Unit unit = null;
        SubUnit subUnit = null;

        if (request.getLevelId() != null) {
            level = levelRepository.findById(request.getLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid level ID"));
        }

        if (request.getGradeId() != null) {
            grade = gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid grade ID"));

            // Auto-set subject, unit, subUnit to first item in selected grade
            List<Subject> subjects = subjectRepository.findByGradeIdOrderByOrderIndexAsc(grade.getId());
            if (!subjects.isEmpty()) {
                subject = subjects.get(0);

                List<Unit> units = unitRepository.findByGradeIdOrderByOrderIndexAsc(grade.getId());
                if (!units.isEmpty()) {
                    unit = units.get(0);

                    List<SubUnit> subUnits = subUnitRepository.findByUnitIdOrderByOrderIndexAsc(unit.getId());
                    if (!subUnits.isEmpty()) {
                        subUnit = subUnits.get(0);
                    }
                }
            }
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(fullName)
                .role(request.getRole() != null ? request.getRole() : "STUDENT")
                .level(level)
                .grade(grade)
                .subject(subject)
                .unit(unit)
                .subUnit(subUnit)
                .proficiencyLevel(request.getProficiencyLevel())
                .active(true)
                .build();

        userRepository.save(user);

        // Generate tokens
        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        // Try to find user by username first, then by email
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        if (!user.getActive()) {
            throw new IllegalStateException("User account is deactivated");
        }

        // Generate tokens
        String token = jwtTokenProvider.createToken(user.getUsername(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getUsername());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return buildUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String username, UserProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Update basic info
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
        }

        if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            // Check if email is already taken by another user
            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new IllegalArgumentException("Email already exists");
                        }
                    });
            user.setEmail(request.getEmail());
        }

        // Update level and grade
        if (request.getLevelId() != null) {
            Level level = levelRepository.findById(request.getLevelId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid level ID"));
            user.setLevel(level);
        }

        if (request.getGradeId() != null) {
            Grade grade = gradeRepository.findById(request.getGradeId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid grade ID"));
            user.setGrade(grade);
        }

        // Update subject, unit, subUnit
        if (request.getSubjectId() != null) {
            Subject subject = subjectRepository.findById(request.getSubjectId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid subject ID"));
            user.setSubject(subject);
        }

        if (request.getUnitId() != null) {
            Unit unit = unitRepository.findById(request.getUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid unit ID"));
            user.setUnit(unit);
        }

        if (request.getSubUnitId() != null) {
            SubUnit subUnit = subUnitRepository.findById(request.getSubUnitId())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid sub-unit ID"));
            user.setSubUnit(subUnit);
        }

        // Update proficiency level
        if (request.getProficiencyLevel() != null) {
            user.setProficiencyLevel(request.getProficiencyLevel());
        }

        // Update password if provided
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getCurrentPassword() == null || request.getCurrentPassword().isEmpty()) {
                throw new IllegalArgumentException("Current password is required");
            }

            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new IllegalArgumentException("Current password is incorrect");
            }

            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);

        return buildUserResponse(user);
    }

    private UserResponse buildUserResponse(User user) {
        UserResponse.UserResponseBuilder builder = UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .proficiencyLevel(user.getProficiencyLevel());

        if (user.getLevel() != null) {
            builder.levelId(user.getLevel().getId())
                    .levelName(user.getLevel().getName());
        }

        if (user.getGrade() != null) {
            builder.gradeId(user.getGrade().getId())
                    .gradeName(user.getGrade().getName());
        }

        if (user.getSubject() != null) {
            builder.subjectId(user.getSubject().getId())
                    .subjectName(user.getSubject().getDisplayName());
        }

        if (user.getUnit() != null) {
            builder.unitId(user.getUnit().getId())
                    .unitName(user.getUnit().getDisplayName());
        }

        if (user.getSubUnit() != null) {
            builder.subUnitId(user.getSubUnit().getId())
                    .subUnitName(user.getSubUnit().getDisplayName());
        }

        return builder.build();
    }
}
