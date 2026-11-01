package com.agrocontrol.shared.web;

import com.agrocontrol.shared.application.ProjectInfoService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final ProjectInfoService projectInfoService;
    private final boolean demo;

    public HealthController(ProjectInfoService projectInfoService, @Value("${agrocontrol.demo}") boolean demo) {
        this.projectInfoService = projectInfoService;
        this.demo = demo;
    }

    @GetMapping
    public Map<String, Object> health() {
        return Map.of(
                "status", "OK",
                "application", projectInfoService.projectName(),
                "stage", projectInfoService.backendStage(),
                "timestamp", Instant.now().toString(),
                "demo", demo
        );
    }
}
