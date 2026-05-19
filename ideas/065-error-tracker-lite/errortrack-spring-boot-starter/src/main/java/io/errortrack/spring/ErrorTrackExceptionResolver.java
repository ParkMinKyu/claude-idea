package io.errortrack.spring;

import io.errortrack.core.ErrorTrack;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.web.servlet.HandlerExceptionResolver;
import org.springframework.web.servlet.ModelAndView;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Captures any exception that bubbles up to Spring MVC dispatch.
 * Returns {@code null} so existing handlers (Spring's default + user
 * {@code @ControllerAdvice}) still produce the response.
 */
public class ErrorTrackExceptionResolver implements HandlerExceptionResolver, Ordered {

    @Override
    public ModelAndView resolveException(HttpServletRequest request,
                                         HttpServletResponse response,
                                         Object handler,
                                         Exception ex) {
        Map<String, String> ctx = new LinkedHashMap<>();
        ctx.put("http.method", request.getMethod());
        ctx.put("http.path", request.getRequestURI());
        ctx.put("http.user-agent", header(request, "User-Agent"));
        ErrorTrack.capture(ex, ctx);
        return null;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private static String header(HttpServletRequest req, String name) {
        String v = req.getHeader(name);
        return v != null ? v : "";
    }
}
