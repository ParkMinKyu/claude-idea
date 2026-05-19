plugins {
    `java-library`
}

dependencies {
    api(project(":errortrack-core"))
    api(project(":errortrack-logback"))

    compileOnly("org.springframework.boot:spring-boot-autoconfigure:3.3.0")
    compileOnly("org.springframework.boot:spring-boot:3.3.0")
    compileOnly("org.springframework:spring-web:6.1.8")
    compileOnly("jakarta.servlet:jakarta.servlet-api:6.0.0")

    annotationProcessor("org.springframework.boot:spring-boot-configuration-processor:3.3.0")

    testImplementation("org.springframework.boot:spring-boot-starter-test:3.3.0")
    testImplementation("org.springframework.boot:spring-boot-starter-web:3.3.0")
}
