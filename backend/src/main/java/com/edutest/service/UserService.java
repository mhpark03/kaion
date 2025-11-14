package com.edutest.service;

import com.edutest.dto.AuthResponse;
import com.edutest.dto.LoginRequest;
import com.edutest.dto.RegisterRequest;
import com.edutest.entity.User;
import com.edutest.repository.UserRepository;
import com.edutest.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

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

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(fullName)
                .role(request.getRole() != null ? request.getRole() : "STUDENT")
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
}
