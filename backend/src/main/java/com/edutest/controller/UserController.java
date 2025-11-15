package com.edutest.controller;

import com.edutest.dto.UserProfileUpdateRequest;
import com.edutest.dto.UserResponse;
import com.edutest.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {
        try {
            String username = authentication.getName();
            UserResponse userResponse = userService.getUserByUsername(username);
            return ResponseEntity.ok(userResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestBody UserProfileUpdateRequest request,
            Authentication authentication
    ) {
        try {
            String username = authentication.getName();
            UserResponse updatedUser = userService.updateProfile(username, request);
            return ResponseEntity.ok(updatedUser);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Profile update failed: " + e.getMessage());
        }
    }
}
