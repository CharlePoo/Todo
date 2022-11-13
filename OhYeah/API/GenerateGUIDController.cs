using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace OhYeah.API
{
    [Route("api/[controller]")]
    [ApiController]
    public class GenerateGUIDController : ControllerBase
    {
        // GET: api/<ValuesController>
        [HttpGet]
        public string Get()
        {
            return Guid.NewGuid().ToString();
        }
    }
}
