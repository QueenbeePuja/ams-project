package com.ams.amsbackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse
                                    response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (path.contains("/api/login") || path.contains("/timetable")) {
            filterChain.doFilter(request, response);
            return;
        }

        System.out.println("JWT FILTER RUNNING");
        String authHeader = request.getHeader("Authorization");
        if(authHeader != null && authHeader.startsWith("Bearer ")){
            System.out.println("AUTH HEADER: " + authHeader);
            String token = authHeader.substring(7);
            try{
                String userId = jwtUtil.extractUserId(token);
                 String role = jwtUtil.extractRole(token);

                 if(role!= null) {
                     List<SimpleGrantedAuthority> authorities =
                             List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
                     System.out.println("ROLE FROM TOKEN: " + role);
                     UsernamePasswordAuthenticationToken auth =
                             new UsernamePasswordAuthenticationToken(
                                     userId, null, authorities
                             );

                     auth.setDetails(
                             new org.springframework.security.web.authentication.WebAuthenticationDetailsSource()
                                     .buildDetails(request)
                     );
                     org.springframework.security.core.context.SecurityContextHolder.getContext()
                             .setAuthentication(auth);
                     System.out.println("AUTH SET SUCCESSFULLY");
                 }
            }catch (Exception e){
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                return;
            }
        }
        filterChain.doFilter(request,response);
    }
}
