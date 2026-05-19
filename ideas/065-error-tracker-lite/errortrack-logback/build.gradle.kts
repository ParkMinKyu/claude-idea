plugins {
    `java-library`
}

dependencies {
    api(project(":errortrack-core"))
    api("ch.qos.logback:logback-classic:1.4.14")

    testImplementation("com.github.tomakehurst:wiremock-standalone:3.6.0")
}
